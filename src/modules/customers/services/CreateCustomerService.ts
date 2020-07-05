import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Customer from '../infra/typeorm/entities/Customer';
import ICustomersRepository from '../repositories/ICustomersRepository';

interface IRequest {
  name: string;
  email: string;
}

@injectable()
class CreateCustomerService {
  constructor(
    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ name, email }: IRequest): Promise<Customer> {
    const IsEmailAlreadyBeingUsed = await this.customersRepository.findByEmail(
      email,
    );

    if (IsEmailAlreadyBeingUsed) {
      throw new AppError('The given e-mail is already being used');
    }

    const newCustomer = this.customersRepository.create({ name, email });

    return newCustomer;
  }
}

export default CreateCustomerService;
