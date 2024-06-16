import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { InputSelect } from "./components/InputSelect";
import { Instructions } from "./components/Instructions";
import { Transactions } from "./components/Transactions";
import { useEmployees } from "./hooks/useEmployees";
import { usePaginatedTransactions } from "./hooks/usePaginatedTransactions";
import { useTransactionsByEmployee } from "./hooks/useTransactionsByEmployee";
import { EMPTY_EMPLOYEE } from "./utils/constants";
import { Employee } from "./utils/types";
import React from "react";

export function App() {
  const { data: employees, ...employeeUtils } = useEmployees();
  const { data: paginatedTransactions, ...paginatedTransactionsUtils } =
    usePaginatedTransactions();
  const { data: transactionsByEmployee, ...transactionsByEmployeeUtils } =
    useTransactionsByEmployee();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] =
    useState<Employee>(EMPTY_EMPLOYEE);
  const [approvals, setApprovals] = useState<{ [key: string]: boolean }>({});

  const transactions = useMemo(
    () => paginatedTransactions?.data ?? transactionsByEmployee ?? null,
    [paginatedTransactions, transactionsByEmployee]
  );

  const loadAllTransactions = useCallback(async () => {
    setIsLoading(true);
    transactionsByEmployeeUtils.invalidateData();

    await employeeUtils.fetchAll();
    setIsLoading(false);
    await paginatedTransactionsUtils.fetchAll();
  }, [employeeUtils, paginatedTransactionsUtils, transactionsByEmployeeUtils]);

  const loadTransactionsByEmployee = useCallback(
    async (employeeId: string) => {
      paginatedTransactionsUtils.invalidateData();
      await transactionsByEmployeeUtils.fetchById(employeeId);
    },
    [paginatedTransactionsUtils, transactionsByEmployeeUtils]
  );

  useEffect(() => {
    if (employees === null && !employeeUtils.loading) {
      loadAllTransactions();
    }
  }, [employeeUtils.loading, employees, loadAllTransactions]);

  const handleEmployeeChange = async (newValue: Employee | null) => {
    if (newValue == null) {
      return;
    }
    setSelectedEmployee(newValue);
    if (newValue.id === EMPTY_EMPLOYEE.id) {
      await loadAllTransactions();
    } else {
      await loadTransactionsByEmployee(newValue.id);
    }
  };

  const handleApprovalChange = (transactionId: string, newValue: boolean) => {
    setApprovals((prev) => ({ ...prev, [transactionId]: newValue }));
  };

  const hasMoreTransactions = useMemo(() => {
    return paginatedTransactions?.nextPage !== null;
  }, [paginatedTransactions]);

  return (
    <Fragment>
      <main className="MainContainer">
        <Instructions />

        <hr className="RampBreak--l" />

        <InputSelect<Employee>
          isLoading={isLoading}
          defaultValue={EMPTY_EMPLOYEE}
          items={employees === null ? [] : [EMPTY_EMPLOYEE, ...employees]}
          label="Filter by employee"
          loadingLabel="Loading employees"
          parseItem={(item) => ({
            value: item.id,
            label: `${item.firstName} ${item.lastName}`,
          })}
          onChange={handleEmployeeChange}
        />

        <div className="RampBreak--l" />

        <div className="RampGrid">
          <Transactions
            transactions={transactions}
            approvals={approvals}
            onApprovalChange={handleApprovalChange}
          />

          {transactions !== null &&
            selectedEmployee?.id === EMPTY_EMPLOYEE.id &&
            hasMoreTransactions && (
              <button
                className="RampButton"
                disabled={paginatedTransactionsUtils.loading}
                onClick={async () => {
                  await paginatedTransactionsUtils.fetchAll();
                }}
              >
                View More
              </button>
            )}
        </div>
      </main>
    </Fragment>
  );
}
