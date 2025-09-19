export interface UserFacingError {
    message: string;
    code: string;
    originalError?: string;
}

export class ErrorMapper {
    static toUserFacingError(error: any): UserFacingError {
        let userMessage = 'เกิดข้อผิดพลาดในการสร้างการชำระเงิน';
        let errorCode = 'PAYMENT_CREATION_FAILED';
        const originalErrorMessage = error instanceof Error ? error.message : String(error);

        if (originalErrorMessage.includes('expired key') || originalErrorMessage.includes('authentication failed')) {
            userMessage = 'ระบบชำระเงินไม่พร้อมใช้งาน กรุณาลองใหม่อีกครั้ง';
            errorCode = 'PAYMENT_SERVICE_UNAVAILABLE';
        } else if (originalErrorMessage.includes('Seat not found')) {
            userMessage = 'ไม่พบที่นั่งที่เลือก กรุณาเลือกที่นั่งใหม่';
            errorCode = 'SEAT_NOT_FOUND';
        } else if (originalErrorMessage.includes('Seat is not available')) {
            userMessage = 'ที่นั่งนี้ถูกจองแล้ว กรุณาเลือกที่นั่งอื่น';
            errorCode = 'SEAT_NOT_AVAILABLE';
        } else if (originalErrorMessage.includes('invalid input syntax for type uuid')) {
            userMessage = 'ข้อมูลที่นั่งไม่ถูกต้อง กรุณาเลือกที่นั่งใหม่';
            errorCode = 'INVALID_SEAT_ID';
        } else if (originalErrorMessage.includes('insufficient funds')) {
            userMessage = 'ยอดเงินไม่เพียงพอ กรุณาตรวจสอบยอดเงินในบัญชี';
            errorCode = 'INSUFFICIENT_FUNDS';
        } else if (originalErrorMessage.includes('card declined')) {
            userMessage = 'บัตรเครดิตถูกปฏิเสธ กรุณาตรวจสอบข้อมูลบัตรหรือใช้บัตรอื่น';
            errorCode = 'CARD_DECLINED';
        }

        return { message: userMessage, code: errorCode, originalError: originalErrorMessage };
    }
}
