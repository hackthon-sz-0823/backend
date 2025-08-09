import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  Query,
} from '@nestjs/common';
import { RestDemoService, User } from './rest-demo.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ApiResponse } from '@src/common/decorators/enhanced-api-response.decorator';
import { ApiTags } from '@nestjs/swagger';

@Controller('rest-demo/users')
@ApiResponse()
@ApiTags('RestDemo-示例接口')
export class RestDemoController {
  constructor(private readonly restDemoService: RestDemoService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): User {
    return this.restDemoService.create(createUserDto);
  }

  @Get()
  async findAll(): Promise<User[]> {
    return await this.restDemoService.findAll();
  }

  @Get('search')
  @ApiResponse()
  searchByName(@Query('keyword') keyword: string): User[] {
    if (!keyword) {
      return [];
    }
    return this.restDemoService.searchByName(keyword);
  }

  @Get('email/:email')
  findByEmail(@Param('email') email: string): User | null {
    return this.restDemoService.findByEmail(email);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): User {
    return this.restDemoService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): User {
    return this.restDemoService.update(id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.restDemoService.remove(id);
  }
}
