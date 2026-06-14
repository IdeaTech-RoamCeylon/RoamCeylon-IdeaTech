import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const guide = await prisma.adminUser.findFirst({
    where: { role: 'tour_guide' }
  });
  if (!guide) {
    console.log("No guide found.");
    return;
  }
  
  await prisma.tourNotification.createMany({
    data: [
      {
        guideId: guide.id,
        type: 'booking',
        title: 'New Booking Confirmed',
        message: 'Eleanor Richards successfully booked the "7-Day Cultural Triangle" tour package.',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
      },
      {
        guideId: guide.id,
        type: 'chat',
        title: 'New Message from Sophia',
        message: 'Sophia Henderson: "Awaiting your custom hotel bookings proposal for 98 Acres..."',
        isRead: true,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5), // 5 hours ago
      },
      {
        guideId: guide.id,
        type: 'alert',
        title: 'Urgent Action Required',
        message: 'You have 4 pending guest requests that will expire soon. Please review and reply.',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      },
      {
        guideId: guide.id,
        type: 'chat',
        title: 'Itinerary Revision Requested',
        message: 'Marcus Thorne requested changes to include whale watching in Mirissa on Day 4.',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48), // 2 days ago
      },
      {
        guideId: guide.id,
        type: 'payment',
        title: 'Deposit Payment Received',
        message: 'Received deposit payment of $1,000 for itinerary #RC-8872 (Eleanor Richards).',
        isRead: false,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72), // 3 days ago
      }
    ]
  });
  console.log("Seeded old notifications!");
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
