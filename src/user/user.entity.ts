import { IsDate, IsEmail, IsString } from 'class-validator';
import { Subscribed } from 'src/subscribed/subscribed.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @IsString()
  uniqueId: string;

  @Column()
  @IsEmail()
  email: string;

  @Column()
  @IsString()
  username: string;

  @Column()
  @IsString()
  profileImage: string;

  @OneToMany((type) => Subscribed, (subscribed) => subscribed.owner)
  subscribedList: Subscribed[];

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
