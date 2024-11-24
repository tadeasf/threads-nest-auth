import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ThreadsAuth } from '../schemas/threads-auth.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    @InjectModel(ThreadsAuth.name) private threadsAuthModel: Model<ThreadsAuth>
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const session = request.session;

    if (!session?.user_id) {
      throw new UnauthorizedException();
    }

    const userAuth = await this.threadsAuthModel.findOne({ 
      userId: session.user_id 
    });

    if (!userAuth) {
      throw new UnauthorizedException();
    }

    request.user = userAuth;
    return true;
  }
} 