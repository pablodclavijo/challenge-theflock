/**
 * Componente Tarjeta de Producto
 */

import { Link } from 'react-router-dom';
import type { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const inStock = product.stock > 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group block bg-white rounded-2xl overflow-hidden border border-slate-200 hover:border-slate-300 hover:shadow-card-hover shadow-card transition-all duration-300"
    >
      {/* Product Image */}
      <div className="relative aspect-square bg-slate-100 overflow-hidden">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200">
            <svg
              className="w-16 h-16 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Out of stock overlay */}
        {!inStock && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] flex items-center justify-center">
            <span className="text-sm font-semibold text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-300">
              Agotado
            </span>
          </div>
        )}

        {/* Stock badge */}
        {inStock && product.stock <= 5 && (
          <span className="absolute top-3 left-3 text-xs font-semibold bg-orange-500 text-white px-2.5 py-1 rounded-full">
            ¡Últimas unidades!
          </span>
        )}
      </div>

      {/* Card Body */}
      <div className="p-5">
        <h3 className="text-sm font-semibold text-slate-900 line-clamp-2 leading-snug group-hover:text-slate-600 transition-colors">
          {product.name}
        </h3>

        <p className="text-xs text-slate-500 mt-2 line-clamp-1">
          {product.description}
        </p>

        <div className="mt-4 flex items-center justify-between">
          <span className="text-lg font-bold text-slate-900">
            {formatPrice(product.price)}
          </span>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${
              inStock
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {inStock ? 'En stock' : 'Agotado'}
          </span>
        </div>

        {/* CTA hover reveal */}
        <div className="mt-4 overflow-hidden max-h-0 group-hover:max-h-12 transition-all duration-300">
          <span className="block text-center text-xs font-semibold text-slate-900 bg-slate-100 rounded-lg py-2.5">
            Ver producto →
          </span>
        </div>
      </div>
    </Link>
  );
};
