import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

// Import only the plugins we need and that are compatible
const mongooseInt32 = require('mongoose-int32');
const mongooseAutopopulate = require('mongoose-autopopulate');
const mongooseUpdateVersioning = require('mongoose-update-versioning');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          // Apply plugins that are working correctly
          connection.plugin(mongooseInt32);
          connection.plugin(mongooseAutopopulate);
          connection.plugin(mongooseUpdateVersioning);

          return connection;
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
