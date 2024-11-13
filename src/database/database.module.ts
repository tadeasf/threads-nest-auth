import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import * as mongooseInt32 from 'mongoose-int32';
import * as mongooseDouble from 'mongoose-double';
import * as mongooseAutopopulate from 'mongoose-autopopulate';
import * as mongooseUpdateVersioning from 'mongoose-update-versioning';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        connectionFactory: (connection) => {
          connection.plugin(mongooseInt32);
          connection.plugin(mongooseDouble);
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
