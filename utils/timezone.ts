import { toZonedTime } from 'date-fns-tz';

export const convertToPhilippineTime = (date: Date = new Date()): Date => {
    return toZonedTime(date, 'Asia/Manila');
};
