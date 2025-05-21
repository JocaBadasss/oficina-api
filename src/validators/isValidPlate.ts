import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsValidPlate(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'IsValidPlate',
      target: object.constructor,
      propertyName: propertyName,
      options: {
        message:
          'Placa deve seguir o padrão antigo (ABC-1234) ou o novo Mercosul (BRA2E19)',
        ...validationOptions,
      },
      validator: {
        validate(value: any) {
          if (typeof value !== 'string') return false;

          const placa = value.toUpperCase().replace('-', '').trim();

          const oldPattern = /^[A-Z]{3}\d{4}$/;
          const newPattern = /^[A-Z]{3}\d[A-Z]\d{2}$/;

          return oldPattern.test(placa) || newPattern.test(placa);
        },
      },
    });
  };
}
