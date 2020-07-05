import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,

    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,

    @inject('CustomersRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('This customer does not exist');
    }

    const inStockProducts = await this.productsRepository.findAllById(products);

    if (inStockProducts.length < 0) {
      throw new AppError('Could not find any products with the given ids');
    }

    const inStockProductsIds = inStockProducts.map(product => product.id);

    const unavailableProducts = products.filter(
      ({ id }) => !inStockProductsIds.includes(id),
    );

    if (unavailableProducts.length > 0) {
      throw new AppError(`Could not find product(s)`);
    }

    const productsWithoutEnoughStock = products.reduce((acc, product) => {
      const currentProduct = inStockProducts.find(p => p.id === product.id);

      if (currentProduct && currentProduct.quantity < product.quantity) {
        return [...acc, product];
      }

      return acc;
    }, [] as IProduct[]);

    if (productsWithoutEnoughStock.length > 0) {
      throw new AppError(`There are products without enough stock`);
    }

    const formattedProducts = products.map(product => ({
      product_id: product.id,
      quantity: product.quantity,
      price: inStockProducts.filter(p => p.id === product.id)[0].price,
    }));

    const newOrder = await this.ordersRepository.create({
      customer,
      products: formattedProducts,
    });

    const { order_products } = newOrder;

    const orderedProductsQtyUpdated = order_products.map(product => {
      const currentProduct = inStockProducts.filter(
        p => p.id === product.product_id,
      )[0];

      const quantity = currentProduct.quantity - product.quantity;

      return {
        id: product.product_id,
        quantity,
      };
    });

    await this.productsRepository.updateQuantity(orderedProductsQtyUpdated);

    return newOrder;
  }
}

export default CreateOrderService;
