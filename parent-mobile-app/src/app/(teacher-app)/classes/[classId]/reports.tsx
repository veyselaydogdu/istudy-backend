import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

export default function ReportsRedirect() {
  const { classId } = useLocalSearchParams<{ classId: string }>();

  useEffect(() => {
    router.replace(`/(teacher-app)/classes/${classId}`);
  }, [classId]);

  return null;
}
