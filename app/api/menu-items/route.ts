import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { MenuItem, MenuIngredient } from '@/types/menu'

interface MenuItemWithIngredients {
  id: string
  code: string
  name: string
  description: string | null
  price: number
  ingredients: Array<{
    id: string
    menuItemId: string
    productId: string
    quantity: number
    product: {
      name: string
      price: number
      unit: string
    }
  }>
  createdAt: Date
  updatedAt: Date
}

export async function GET() {
  try {
    const menuItems = await prisma.menuItem.findMany({
      include: {
        ingredients: {
          include: {
            product: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    // Her menü kalemi için maliyet hesapla
    const menuItemsWithCost = menuItems.map((item: MenuItemWithIngredients): MenuItem => {
      const totalCost = item.ingredients.reduce((sum: number, ing: MenuIngredient) => 
        sum + (ing.product.price * ing.quantity), 0)
      
      const profitMargin = ((item.price - totalCost) / item.price) * 100

      return {
        id: item.id,
        code: item.code,
        name: item.name,
        description: item.description,
        price: item.price,
        ingredients: item.ingredients,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        totalCost,
        profitMargin
      }
    })

    return NextResponse.json(menuItemsWithCost)
  } catch (error) {
    console.error('Menü kalemleri yüklenirken hata:', error)
    return NextResponse.json(
      { error: 'Menü kalemleri yüklenirken bir hata oluştu' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()

    // Menü kodu oluştur
    const menuItemCount = await prisma.menuItem.count()
    const code = `MENU${(menuItemCount + 1).toString().padStart(4, '0')}`

    // Menü kalemini oluştur
    const menuItem = await prisma.menuItem.create({
      data: {
        code,
        name: data.name,
        description: data.description || null,
        price: data.price,
        ingredients: {
          create: data.ingredients.map((ing: { productId: string; quantity: number }) => ({
            productId: ing.productId,
            quantity: ing.quantity
          }))
        }
      },
      include: {
        ingredients: {
          include: {
            product: true
          }
        }
      }
    })

    return NextResponse.json(menuItem)
  } catch (error) {
    console.error('Menü kalemi kaydedilirken hata:', error)
    return NextResponse.json(
      { error: 'Menü kalemi kaydedilirken bir hata oluştu' },
      { status: 500 }
    )
  }
}