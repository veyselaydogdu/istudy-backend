'use client';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import apiClient from '@/lib/apiClient';

type ApprovalsCountContextType = {
    totalCount: number;
    refresh: () => void;
};

const ApprovalsCountContext = createContext<ApprovalsCountContextType>({ totalCount: 0, refresh: () => {} });

export function ApprovalsCountProvider({ children }: { children: React.ReactNode }) {
    const [totalCount, setTotalCount] = useState(0);

    const refresh = useCallback(async () => {
        try {
            const [approvalsRes, credentialsRes] = await Promise.all([
                apiClient.get('/pending-approvals'),
                apiClient.get('/teacher-approvals'),
            ]);
            const approvalTotal = approvalsRes.data?.data?.counts?.total ?? 0;
            const credentialTotal = (credentialsRes.data?.data ?? []).length;
            setTotalCount(approvalTotal + credentialTotal);
        } catch {
            // silent
        }
    }, []);

    useEffect(() => { refresh(); }, [refresh]);

    return (
        <ApprovalsCountContext.Provider value={{ totalCount, refresh }}>
            {children}
        </ApprovalsCountContext.Provider>
    );
}

export const useApprovalsCount = () => useContext(ApprovalsCountContext);
