/**
 * @file 404 page.
 */

import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-10 text-center">
      <div className="text-6xl">♟️</div>
      <h1 className="mt-4 font-display text-3xl font-bold text-white">404</h1>
      <p className="mt-2 text-timur-300">Bu kare tahtada yok.</p>
      <Link to="/" className="btn-primary mt-6 inline-flex">
        Ana Sayfaya Dön
      </Link>
    </div>
  );
}
