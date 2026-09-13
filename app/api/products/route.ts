import { NextRequest, NextResponse } from 'next/server';
import { getAllProducts, getProducts, createProduct } from '@/app/lib/queries/products';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    // Paginated object when page/perPage given (stock table); full array otherwise (dropdowns)
    if (searchParams.has("page") || searchParams.has("perPage")) {
      const page = Math.max(parseInt(searchParams.get("page") ?? "1", 10) || 1, 1);
      const perPage = Math.min(Math.max(parseInt(searchParams.get("perPage") ?? "10", 10) || 10, 1), 100);
      const { rows, total } = await getProducts({ limit: perPage, offset: (page - 1) * perPage });
      return NextResponse.json({ rows, total, page, perPage, totalPages: Math.max(Math.ceil(total / perPage), 1) });
    }
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