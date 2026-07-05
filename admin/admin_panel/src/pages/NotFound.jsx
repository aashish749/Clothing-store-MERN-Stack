import React from "react";
import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-4xl flex-col items-center justify-center text-center">
        <p className="text-xs uppercase tracking-[0.32em] text-white/50">
          Admin Panel
        </p>
        <h1 className="mt-4 text-5xl font-semibold">Page not found</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-white/70">
          The admin route you tried to open does not exist yet.
        </p>
        <Link
          to="/admin"
          className="mt-8 rounded-2xl bg-white px-5 py-3 text-sm font-medium text-slate-950"
        >
          Go to dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
