// @ts-nocheck
'use strict';
const { groupBy } = require('lodash/fp');
const moment = require('moment');
const { Model, Op } = require('sequelize');

class Feedback extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            description: {
                type: DataTypes.STRING,
            },
            message: {
                type: DataTypes.TEXT,
            },
        };

        return super.init(schema, {
            modelName: 'feedback',
            freezeTableName: true,
            sequelize,
        });
    }
    static storeFeedback({ description, message }) {
        const expiryDate = moment().subtract(3, 'months').toDate();

        return Promise.all([
            this.create({
                description,
                message,
            }),
            // Clean up old responses
            this.destroy({
                where: {
                    createdAt: { [Op.lte]: expiryDate },
                },
            }),
        ]);
    }

    static findAllGroupedByDescription(dateRange) {
        let whereClause = {};
        if (dateRange) {
            whereClause = {
                createdAt: { [Op.between]: [dateRange.start, dateRange.end] },
            };
        }
        return this.findAll({
            order: [
                ['description', 'ASC'],
                ['updatedAt', 'DESC'],
            ],
            where: whereClause,
        }).then(groupBy((result) => result.description.toLowerCase()));
    }

    static findAllForDescription(descriptions = []) {
        return this.findAll({
            where: {
                description: {
                    [Op.in]: descriptions,
                },
            },
            order: [
                ['description', 'ASC'],
                ['updatedAt', 'DESC'],
            ],
        });
    }
}

module.exports = Feedback;
