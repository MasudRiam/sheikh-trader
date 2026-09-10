import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, createProduct } from '@/app/lib/queries/products';

export async function GET() {
  try {
    const products = await getAllProducts();
    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body.name || !body.category || body.buy_price == null || body.sell_price == null) {
      return NextResponse.json({ error: 'name, category, buy_price, sell_price are required' }, { status: 400 });
    }

    const product = await createProduct(body);
    return NextResponse.json(product, { status: 201 });
  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
  }
}