/*
  Warnings:

  - A unique constraint covering the columns `[hotel_id,room_number]` on the table `Rooms` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Rooms_hotel_id_key";

-- DropIndex
DROP INDEX "Rooms_room_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "Rooms_hotel_id_room_number_key" ON "Rooms"("hotel_id", "room_number");
