import { IsDate, IsString } from 'class-validator';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
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

  @ManyToMany((type) => User, { eager: true })
  @JoinTable()
  followers: User[];

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
