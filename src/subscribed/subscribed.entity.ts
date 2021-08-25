import { IsDate, IsNumber, IsString } from 'class-validator';
import { Post } from 'src/post/post.entity';
import { User } from 'src/user/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
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

  @Column({ nullable: true })
  profileImageUrl: string | null;

  @Column({ nullable: true })
  serviceOn: string | null;

  @OneToMany((type) => Post, (post) => post.subscribed)
  posts: Post[];

  @ManyToMany((type) => User, { eager: true })
  @JoinTable()
  followers: User[];

  @Column({ default: 0 })
  @IsNumber()
  renewalTime: number;

  @CreateDateColumn()
  @IsDate()
  createdAt: Date;

  @UpdateDateColumn()
  @IsDate()
  updatedAt: Date;
}
