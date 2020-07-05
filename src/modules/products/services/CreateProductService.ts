import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const IsThereAProductWithThisName = await this.productsRepository.findByName(
      name,
    );

    if (IsThereAProductWithThisName) {
      throw new AppError('A product with the given name already exists');
    }

    const newProduct = this.productsRepository.create({
      name,
      price,
      quantity,
    });

    return newProduct;
  }
}

export default CreateProductService;
