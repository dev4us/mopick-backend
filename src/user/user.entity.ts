import { IsDate, IsEmail, IsString } from 'class-validator';
import { Subscribed } from 'src/subscribed/subscribed.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
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

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
