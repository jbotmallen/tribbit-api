import { format } from 'date-fns-tz';
import { parseISO } from 'date-fns';

export const convertToPhilippineTime = (date: Date = new Date()): Date => {
    const formattedDate = format(date, "yyyy-MM-dd'T'HH:mm:ssXXX", { timeZone: 'Asia/Manila' });
    return parseISO(formattedDate); 
};
