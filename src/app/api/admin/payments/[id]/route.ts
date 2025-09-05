import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";

function verifyAdmin(request: NextRequest) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.split(" ")[1];
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "your-jwt-secret-key"
    ) as any;
    return decoded.role === "admin" ? decoded : null;
  } catch {
    return null;
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // 驗證管理者身份
    const admin = verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: "未授權訪問" }, { status: 401 });
    }

    const { status } = await request.json();
    const paymentId = id;

    // 更新繳費狀態
    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        paymentStatus: status,
        confirmedAt: status === "confirmed" ? new Date() : null,
        confirmedBy: status === "confirmed" ? admin.username : null,
      },
    });

    return NextResponse.json({
      success: true,
      payment,
    });
  } catch (error) {
    console.error("Update payment status error:", error);
    return NextResponse.json({ error: "更新繳費狀態失敗" }, { status: 500 });
  }
}
