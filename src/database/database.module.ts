import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

// Import plugins using require since they're CommonJS modules
const mongooseInt32 = require('mongoose-int32');
const mongooseAutopopulate = require('mongoose-autopopulate');
const mongooseUpdateVersioning = require('mongoose-update-versioning');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          connection.plugin(mongooseInt32);
          connection.plugin(mongooseAutopopulate);
          return connection;
        },
      }),
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
