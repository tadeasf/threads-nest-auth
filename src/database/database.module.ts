import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';

// Change imports to require statements since these are CommonJS modules
const mongooseInt32 = require('mongoose-int32');
const mongooseDouble = require('mongoose-double');
const mongooseAutopopulate = require('mongoose-autopopulate');
const mongooseUpdateVersioning = require('mongoose-update-versioning');

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          // Some plugins might need to be initialized before use
          const Double = mongooseDouble(connection);

          // Apply plugins
          connection.plugin(mongooseInt32);
          connection.plugin(Double);
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
