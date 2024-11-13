import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

// Import only the plugins we need
const mongooseInt32 = require('mongoose-int32');
const mongooseAutopopulate = require('mongoose-autopopulate');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          // Apply plugins in correct order
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
