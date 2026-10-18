/*
 * Tessera — craft QR codes worth scanning.
 * Copyright (C) 2026 Gaurav Jadhav
 *
 * This program is free software: you can redistribute it and/or modify it
 * under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or (at your
 * option) any later version.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT
 * ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or
 * FITNESS FOR A PARTICULAR PURPOSE. See the GNU Affero General Public License
 * for more details: <https://www.gnu.org/licenses/>.
 */

import { StrictMode } from 'react';
import type { ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';

/** Mounts one page of the sheet. Every entry point boots the same way. */
export function mount(page: ReactNode) {
  const container = document.getElementById('root');
  if (!container) throw new Error('Root element #root is missing from the page');
  createRoot(container).render(<StrictMode>{page}</StrictMode>);
}
