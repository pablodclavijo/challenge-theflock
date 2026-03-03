/**
 * PÃ¡gina de Detalle del Producto
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';
import { Navbar } from '../components/Navbar';
import type { Product } from '../types/product';

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const loadProduct = async () => {
      try {
        setIsLoading(true);
        const data = await apiClient.getProductById(id!);
        setProduct(data);
      } catch (err) {
        setError('No se pudo cargar el producto. Intenta de nuevo.');
        console.error('Error loading product:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadProduct();
    }
  }, [id]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    if (!product) return;

    try {
      setIsAddingToCart(true);
      await apiClient.addToCart(product.id, quantity);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 3000);
    } catch (err) {
      setError('Error al agregar al carrito. Intenta de nuevo.');
      console.error('Error adding to cart:', err);
    } finally {
      setIsAddingToCart(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
    }).format(price);
  };

  const inStock = product ? product.stock > 0 : false;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-slate-200 border-t-slate-900"></div>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-slate-50">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">{error || 'Producto no encontrado'}</h1>
            <Link to="/" className="inline-block mt-4 px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-full transition-colors">
              Volver al catÃ¡logo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-slate-500 mb-6">
          <Link to="/" className="hover:text-slate-900 transition-colors">Productos</Link>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-slate-900 font-medium line-clamp-1">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Product Image */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex items-center justify-center p-6 md:p-10 aspect-square">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-linear-to-br from-slate-100 to-slate-200 rounded-xl">
                <svg className="w-24 h-24 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex flex-col">
            <div className="flex-1">
              {/* Category badge */}
              <span className="inline-block text-xs font-semibold tracking-widest uppercase text-slate-400 mb-2">
                Producto #{product.id}
              </span>

              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-4 leading-tight">
                {product.name}
              </h1>

              {/* Price */}
              <div className="mb-6 flex items-center gap-3">
                <span className="text-3xl font-extrabold text-slate-900">
                  {formatPrice(product.price)}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  inStock ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                }`}>
                  {inStock ? `En stock Â· ${product.stock} disponibles` : 'Agotado'}
                </span>
              </div>

              {/* Description */}
              <div className="mb-6">
                <p className="text-slate-600 leading-relaxed">{product.description}</p>
              </div>

              {/* Specs */}
              <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-6">
                <dl className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <dt className="text-slate-500">CÃ³digo</dt>
                    <dd className="font-medium text-slate-900">#{product.id}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-slate-500">Estado</dt>
                    <dd className="font-medium text-slate-900">{product.isActive ? 'Activo' : 'Inactivo'}</dd>
                  </div>
                  <div className="flex justify-between text-sm">
                    <dt className="text-slate-500">Agregado</dt>
                    <dd className="font-medium text-slate-900">{new Date(product.createdAt).toLocaleDateString('es-ES')}</dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Cart success */}
            {addedToCart && (
              <div className="mb-4 flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <p className="text-emerald-700 text-sm font-medium">AÃ±adido al carrito</p>
              </div>
            )}

            {/* Add to cart section */}
            <div className="border-t border-slate-200 pt-6">
              {inStock ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                      Cantidad
                    </label>
                    <div className="inline-flex items-center border border-slate-200 rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition text-lg leading-none"
                      >
                        âˆ’
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) => setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))}
                        className="w-16 py-2.5 text-center text-sm font-semibold text-slate-900 border-x border-slate-200 focus:outline-none"
                        min="1"
                        max={product.stock}
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="px-4 py-2.5 text-slate-700 hover:bg-slate-50 transition text-lg leading-none"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-slate-900 hover:bg-slate-700 disabled:bg-slate-400 text-white font-semibold rounded-xl transition-colors text-sm"
                  >
                    {isAddingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white"></div>
                        AÃ±adiendoâ€¦
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {isAuthenticated ? 'AÃ±adir al carrito' : 'Inicia sesiÃ³n para comprar'}
                      </>
                    )}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-xs text-slate-500 text-center">
                      <Link to="/login" className="font-semibold text-slate-900 hover:underline">Inicia sesiÃ³n</Link>{' '}
                      para aÃ±adir al carrito
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-base font-semibold text-red-600 mb-4">Producto no disponible</p>
                  <Link to="/" className="inline-block px-6 py-2.5 bg-slate-900 hover:bg-slate-700 text-white text-sm font-semibold rounded-full transition-colors">
                    Seguir comprando
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
