/*
  Warnings:

  - You are about to drop the `Post` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "userRole" AS ENUM ('CUSTOMER', 'OWNER');

-- CreateEnum
CREATE TYPE "bookingStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- DropForeignKey
ALTER TABLE "Post" DROP CONSTRAINT "Post_authorId_fkey";

-- DropTable
DROP TABLE "Post";

-- DropTable
DROP TABLE "User";

-- CreateTable
CREATE TABLE "Users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "role" "userRole" NOT NULL,
    "phone" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hotels" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "city" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "amenities" JSONB NOT NULL DEFAULT '[]',
    "rating" DECIMAL(2,1) NOT NULL DEFAULT 0.0,
    "total_reviews" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Rooms" (
    "id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "room_number" TEXT NOT NULL,
    "room_type" TEXT NOT NULL,
    "price_per_night" DECIMAL(10,2) NOT NULL,
    "max_occupancy" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Rooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Bookings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "check_in_date" TIMESTAMP(3) NOT NULL,
    "check_out_date" TIMESTAMP(3) NOT NULL,
    "guests" INTEGER NOT NULL,
    "total_price" DECIMAL(10,2) NOT NULL,
    "status" "bookingStatus" NOT NULL DEFAULT 'CONFIRMED',
    "booking_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelled_at" TIMESTAMP(3),

    CONSTRAINT "Bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reviews" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "hotel_id" TEXT NOT NULL,
    "booking_id" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reviews_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Users_email_key" ON "Users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Rooms_hotel_id_key" ON "Rooms"("hotel_id");

-- CreateIndex
CREATE UNIQUE INDEX "Rooms_room_number_key" ON "Rooms"("room_number");

-- CreateIndex
CREATE UNIQUE INDEX "Reviews_user_id_key" ON "Reviews"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "Reviews_booking_id_key" ON "Reviews"("booking_id");

-- AddForeignKey
ALTER TABLE "Hotels" ADD CONSTRAINT "Hotels_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rooms" ADD CONSTRAINT "Rooms_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Rooms"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bookings" ADD CONSTRAINT "Bookings_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "Users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_hotel_id_fkey" FOREIGN KEY ("hotel_id") REFERENCES "Hotels"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reviews" ADD CONSTRAINT "Reviews_booking_id_fkey" FOREIGN KEY ("booking_id") REFERENCES "Bookings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
