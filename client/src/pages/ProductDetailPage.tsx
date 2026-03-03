/**
 * Página de Detalle del Producto
 */

import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { apiClient } from '../services/api';
import { useAuthContext } from '../contexts/AuthContext';
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold">
              ← Volver al catálogo
            </Link>
          </div>
        </header>
        <main className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              {error || 'Producto no encontrado'}
            </h1>
            <Link
              to="/"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
            >
              Ir al catálogo
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Encabezado */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <Link to="/" className="text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-2">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver
          </Link>
          <div className="flex space-x-4">
            {!isAuthenticated && (
              <>
                <Link
                  to="/login"
                  className="hidden md:inline-block text-gray-700 hover:text-gray-900 font-semibold"
                >
                  Iniciar Sesión
                </Link>
                <Link
                  to="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200"
                >
                  Registrarse
                </Link>
              </>
            )}
            {isAuthenticated && (
              <Link
                to="/dashboard"
                className="text-gray-700 hover:text-gray-900 font-semibold"
              >
                Mi Cuenta
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
          {/* Imagen del Producto */}
          <div className="flex items-center justify-center bg-white rounded-lg shadow p-4 md:p-8">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="max-w-full h-auto"
              />
            ) : (
              <div className="w-full h-96 flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400 rounded">
                <svg
                  className="w-24 h-24 text-gray-500"
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
          </div>

          {/* Detalles del Producto */}
          <div className="flex flex-col justify-between">
            {/* Nombre e Información */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                {product.name}
              </h1>

              {/* Precio */}
              <div className="mb-6">
                <p className="text-4xl font-bold text-blue-600 mb-2">
                  {formatPrice(product.price)}
                </p>
                <p
                  className={`inline-block text-sm font-medium px-3 py-1 rounded ${
                    inStock
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {inStock ? `En stock (${product.stock} disponibles)` : 'Agotado'}
                </p>
              </div>

              {/* Descripción */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Descripción
                </h3>
                <p className="text-gray-600 leading-relaxed text-base md:text-lg">
                  {product.description}
                </p>
              </div>

              {/* Especificaciones */}
              <div className="bg-gray-100 rounded-lg p-4 md:p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Especificaciones
                </h3>
                <dl className="space-y-3">
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700">Código del producto:</dt>
                    <dd className="text-gray-600">#{product.id}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700">Estado:</dt>
                    <dd className="text-gray-600">
                      {product.isActive ? 'Activo' : 'Inactivo'}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="font-medium text-gray-700">Agregado:</dt>
                    <dd className="text-gray-600">
                      {new Date(product.createdAt).toLocaleDateString('es-ES')}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Compra */}
            {addedToCart && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-green-700 font-medium">
                  ✓ Producto agregado al carrito
                </p>
              </div>
            )}

            <div className="border-t border-gray-200 pt-6 mt-8">
              {inStock ? (
                <div className="space-y-4">
                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cantidad
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={quantity}
                        onChange={(e) =>
                          setQuantity(Math.min(product.stock, Math.max(1, parseInt(e.target.value) || 1)))
                        }
                        className="w-16 px-3 py-2 border border-gray-300 rounded-lg text-center"
                        min="1"
                        max={product.stock}
                      />
                      <button
                        onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                        className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Botones */}
                  <button
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition duration-200 flex items-center justify-center gap-2"
                  >
                    {isAddingToCart ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Agregando...
                      </>
                    ) : (
                      <>
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        {isAuthenticated ? 'Agregar al carrito' : 'Iniciar sesión para comprar'}
                      </>
                    )}
                  </button>

                  {!isAuthenticated && (
                    <p className="text-sm text-gray-600 text-center">
                      <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                        Inicia sesión
                      </Link>{' '}
                      para agregar productos al carrito
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center py-6">
                  <p className="text-lg font-semibold text-red-600 mb-4">
                    Este producto no está disponible en este momento
                  </p>
                  <Link
                    to="/"
                    className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition duration-200"
                  >
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
