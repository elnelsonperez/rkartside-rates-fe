import { Login } from './Login';

export function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Iniciar Sesión
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Ingresa tus credenciales para acceder al sistema
            </p>
          </div>
          
          <Login />
        </div>
      </div>
    </div>
  );
}