CREATE TABLE "pdx-diy_asset" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"objectKey" varchar(500) NOT NULL,
	"originalName" varchar(255) NOT NULL,
	"mimeType" varchar(100) NOT NULL,
	"size" bigint NOT NULL,
	"width" integer,
	"height" integer,
	"bucketName" varchar(100) NOT NULL,
	"publicUrl" varchar(1000),
	"description" varchar(1000),
	"uploadedById" varchar(255),
	"createdAt" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updatedAt" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "pdx-diy_event" ADD COLUMN "heroImageId" varchar(255);--> statement-breakpoint
ALTER TABLE "pdx-diy_asset" ADD CONSTRAINT "pdx-diy_asset_uploadedById_pdx-diy_user_id_fk" FOREIGN KEY ("uploadedById") REFERENCES "public"."pdx-diy_user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pdx-diy_event" ADD CONSTRAINT "pdx-diy_event_heroImageId_pdx-diy_asset_id_fk" FOREIGN KEY ("heroImageId") REFERENCES "public"."pdx-diy_asset"("id") ON DELETE no action ON UPDATE no action;