import { Link } from "wouter";

export default function Navigation() {
  return (
    <nav className="bg-white shadow-lg dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/">
              <a className="text-lg font-bold">BKI Tools</a>
            </Link>
            <div className="hidden md:block ml-10">
              <div className="flex items-center space-x-4">
                <Link href="/dashboard">
                  <a className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">Dashboard</a>
                </Link>
                <Link href="/tools">
                  <a className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">Tools</a>
                </Link>
                <Link href="/stock">
                  <a className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">Stock</a>
                </Link>
                <Link href="/borrowings">
                  <a className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">Borrowings</a>
                </Link>
                <Link href="/approvals">
                  <a className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">Approvals</a>
                </Link>
                <Link href="/analytics">
                  <a className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white px-3 py-2 rounded-md">Analytics</a>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}