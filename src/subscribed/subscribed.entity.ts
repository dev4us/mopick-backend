import { IsDate, IsString } from 'class-validator';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  RelationId,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Subscribed {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  title: string;

  @Column()
  @IsString()
  siteUrl: string;

  @Column()
  @IsString()
  feedUrl: string;

  @Column()
  @IsString()
  serviceOn: string;

  @ManyToOne((type) => User, (user) => user.subscribedList)
  owner: User;

  @RelationId((subscribed: Subscribed) => subscribed.owner)
  userId: number;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
