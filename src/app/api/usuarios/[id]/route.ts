import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import bcrypt from "bcrypt";

// PUT: Editar usuario
export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { email, password, role } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "El correo electrónico es obligatorio." },
        { status: 400 }
      );
    }

    // Validar duplicado excluyendo el actual
    const existing = await db.user.findFirst({
      where: {
        AND: [{ id: { not: id } }, { email }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Ya existe otro usuario registrado con este correo electrónico." },
        { status: 400 }
      );
    }

    const dataToUpdate: any = {
      email,
      role: role || "admin",
    };

    // Hashear contraseña si se pasa una nueva
    if (password && password.trim() !== "") {
      dataToUpdate.passwordHash = await bcrypt.hash(password, 10);
    }

    const updated = await db.user.update({
      where: { id },
      data: dataToUpdate,
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error al editar usuario:", error);
    return NextResponse.json(
      { error: "Error en el servidor al editar el usuario." },
      { status: 500 }
    );
  }
}

// DELETE: Borrar usuario
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Evitar borrar el último administrador
    const user = await db.user.findUnique({ where: { id } });
    if (user && user.role === "admin") {
      const adminCount = await db.user.count({
        where: { role: "admin" },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: "No se puede eliminar el único administrador del sistema." },
          { status: 400 }
        );
      }
    }

    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Usuario eliminado." });
  } catch (error) {
    console.error("Error al borrar usuario:", error);
    return NextResponse.json(
      { error: "Error en el servidor al eliminar el usuario." },
      { status: 500 }
    );
  }
}
