export function isJwtError(error: any): error is { name: string } {
    return error && typeof error.name === 'string';
};