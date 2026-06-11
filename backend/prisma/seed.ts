import { PrismaClient, WorkspaceRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.upsert({
    where: {
      email: "founder@drawai.local"
    },
    update: {},
    create: {
      email: "founder@drawai.local",
      name: "DrawAI Founder"
    }
  });

  const workspace = await prisma.workspace.upsert({
    where: {
      slug: "drawai-demo"
    },
    update: {},
    create: {
      name: "DrawAI Demo",
      slug: "drawai-demo"
    }
  });

  await prisma.workspaceMember.upsert({
    where: {
      workspaceId_userId: {
        workspaceId: workspace.id,
        userId: user.id
      }
    },
    update: {
      role: WorkspaceRole.OWNER
    },
    create: {
      workspaceId: workspace.id,
      userId: user.id,
      role: WorkspaceRole.OWNER
    }
  });

  await prisma.file.create({
    data: {
      workspaceId: workspace.id,
      createdById: user.id,
      title: "Welcome to DrawAI",
      versions: {
        create: {
          versionNumber: 1,
          createdById: user.id,
          message: "Initial seed file",
          document: {
            blocks: [
              {
                type: "heading",
                text: "Welcome to DrawAI"
              },
              {
                type: "paragraph",
                text: "This seed file proves the workspace, user, membership, file, and version models are wired together."
              }
            ]
          },
          canvas: {
            objects: []
          }
        }
      }
    }
  });

  console.log(`Seeded workspace ${workspace.slug} with user ${user.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
