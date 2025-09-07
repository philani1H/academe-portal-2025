import { NextResponse } from "next/server"

const subjects = ["Mathematics", "Science", "English", "History", "Geography", "Computer Science"]

export async function GET() {
  return NextResponse.json(subjects)
}

export async function POST(request: Request) {
  const newSubject = await request.json()
  subjects.push(newSubject)
  return NextResponse.json(subjects)
}

export async function PUT(request: Request) {
  const { index, subject } = await request.json()
  if (index >= 0 && index < subjects.length) {
    subjects[index] = subject
    return NextResponse.json(subjects)
  }
  return NextResponse.json({ error: "Invalid index" }, { status: 400 })
}

export async function DELETE(request: Request) {
  const { index } = await request.json()
  if (index >= 0 && index < subjects.length) {
    subjects.splice(index, 1)
    return NextResponse.json(subjects)
  }
  return NextResponse.json({ error: "Invalid index" }, { status: 400 })
}
