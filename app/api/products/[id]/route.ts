import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from "@/app/lib/auth/session";
import { getProductById, updateProduct, deleteProduct } from '@/app/lib/queries/products';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const product = await getProductById(Number(id), auth.user.id);
  if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(product);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  try {
    const { id } = await params;
    const body = await req.json();
    const product = await updateProduct(Number(id), body, auth.user.id);
    if (!product) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAuth(req);
  if ("response" in auth) return auth.response;
  const { id } = await params;
  const success = await deleteProduct(Number(id), auth.user.id);
  if (!success) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true });
}
