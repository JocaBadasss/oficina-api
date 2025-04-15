import * as bcrypt from 'bcryptjs';
import { PrismaService } from './prisma/prisma.service';

export async function createAdmin(prismaService: PrismaService) {
  const prisma = prismaService;

  const existingAdmin = await prisma.user.findFirst({
    where: { isAdmin: true },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash('admin123', 10);

    await prisma.user.create({
      data: {
        name: 'Administrador',
        email: 'admin@oficina.com',
        password: hashedPassword,
        isAdmin: true,
      },
    });

    console.log('✅ Admin criado com sucesso!');
  } else {
    console.log('ℹ️ Admin não foi criado pois já existe.');
  }
}
