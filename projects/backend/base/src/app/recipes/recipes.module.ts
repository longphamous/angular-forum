import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { UserEntity } from "../user/entities/user.entity";
import { RecipeCategoryEntity } from "./entities/recipe-category.entity";
import { RecipeCommentEntity } from "./entities/recipe-comment.entity";
import { RecipeFavoriteEntity } from "./entities/recipe-favorite.entity";
import { RecipeRatingEntity } from "./entities/recipe-rating.entity";
import { RecipeEntity } from "./entities/recipe.entity";
import { RecipesController } from "./recipes.controller";
import { RecipesService } from "./recipes.service";

@Module({
    imports: [
        TypeOrmModule.forFeature([
            RecipeEntity,
            RecipeCategoryEntity,
            RecipeCommentEntity,
            RecipeFavoriteEntity,
            RecipeRatingEntity,
            UserEntity
        ])
    ],
    controllers: [RecipesController],
    providers: [RecipesService],
    exports: [RecipesService]
})
export class RecipesModule {}
