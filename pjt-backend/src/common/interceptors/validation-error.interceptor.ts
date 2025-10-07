import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable()
export class ValidationErrorInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        // Captura erros de validação do class-validator
        if (error instanceof BadRequestException) {
          const response = error.getResponse() as any;
          
          // Se é um erro de validação com array de mensagens
          if (response.message && Array.isArray(response.message)) {
            const validationErrors = response.message;
            
            // Procura por erros de limite máximo e retorna mensagem mais clara
            const maxValueError = validationErrors.find((msg: string) => 
              msg.includes('não pode exceder') || msg.includes('must not be greater than')
            );
            
            if (maxValueError) {
              return throwError(() => new BadRequestException({
                statusCode: 400,
                message: maxValueError,
                error: 'Validation Error'
              }));
            }
          }
        }
        
        // Captura erros de overflow do PostgreSQL
        if (error.message && error.message.includes('numeric field overflow')) {
          return throwError(() => new BadRequestException({
            statusCode: 400,
            message: 'Valor muito grande. O sistema suporta valores monetários até R$ 99.999.999,99 e quantidades até 999.999.999 unidades.',
            error: 'Database Overflow Error'
          }));
        }
        
        return throwError(() => error);
      }),
    );
  }
}