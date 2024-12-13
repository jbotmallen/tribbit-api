export const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();
};

export const getStartOfWeek = (date: Date): Date => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + 1); // Sunday
    start.setHours(0, 0, 0, 0);
    return start;
};

export const getStartOfMonth = (date: Date): Date => {
    const start = new Date(date.getFullYear(), date.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    return start;
};

export const getEndOfWeek = (startOfWeek: Date): Date => {
    const end = new Date(startOfWeek);
    end.setDate(startOfWeek.getDate() + 6); // Saturday
    end.setHours(23, 59, 59, 999);
    return end;
};

export const generateDateRange = (start: Date, end: Date, frequency: string): string[] => {
    const dates: string[] = [];
    const current = new Date(start);
    while (current <= end) {
        dates.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
    }
    
    return dates;
};