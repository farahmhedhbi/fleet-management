import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { message: 'Logged out successfully' },
      { status: 200 }
    )

    // Clear cookies
    response.cookies.delete('token')
    response.cookies.delete('user')
    response.cookies.delete('role')

    return response
  } catch (error) {
    console.error('Logout error:', error)
    
    return NextResponse.json(
      { message: 'An error occurred during logout' },
      { status: 500 }
    )
  }
}