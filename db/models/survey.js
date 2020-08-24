// @ts-nocheck
'use strict';
const moment = require('moment');
const { Model, Op } = require('sequelize');

class SurveyAnswer extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            choice: {
                type: DataTypes.ENUM('yes', 'no'),
                allowNull: false,
            },
            path: {
                type: DataTypes.TEXT,
                allowNull: false,
            },
            message: {
                type: DataTypes.TEXT,
            },
        };

        return super.init(schema, {
            modelName: 'survey',
            freezeTableName: true,
            sequelize,
        });
    }
    static createResponse({ choice, path, message }) {
        const expiryDate = moment().subtract(3, 'months').toDate();

        return Promise.all([
            this.create({
                choice: choice,
                path: path,
                message: message,
            }),
            // Clean up old responses
            this.destroy({
                where: { createdAt: { [Op.lte]: expiryDate } },
            }),
        ]);
    }
    static findAllByPath(urlPath, dateRange) {
        const query = {
            order: [['updatedAt', 'DESC']],
            where: {},
        };

        if (urlPath) {
            query.where = { path: { [Op.eq]: urlPath } };
        }

        if (dateRange) {
            const dateClause = {
                createdAt: { [Op.between]: [dateRange.start, dateRange.end] },
            };
            query.where = { ...query.where, ...dateClause };
        }

        return this.findAll(query);
    }
}

module.exports = SurveyAnswer;
