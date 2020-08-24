// @ts-nocheck
'use strict';
const { Model, Op } = require('sequelize');
const moment = require('moment');
const { toOutcode } = require('postcode');

class OrderItem extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            code: {
                type: DataTypes.STRING,
                allowNull: false,
            },
            quantity: {
                type: DataTypes.INTEGER,
                allowNull: false,
            },
        };

        return super.init(schema, {
            modelName: 'order_item',
            sequelize,
        });
    }
}

class Order extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            grantAmount: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            orderReason: {
                type: DataTypes.STRING,
                allowNull: true,
            },
            postcodeArea: {
                type: DataTypes.STRING,
                allowNull: false,
            },
        };

        return super.init(schema, {
            modelName: 'order',
            sequelize,
        });
    }

    static associate(models) {
        this.hasMany(models.OrderItem, {
            as: 'items',
        });
    }

    static getAllOrders(dateRange = {}) {
        let whereClause = {};
        if (dateRange.start && dateRange.end) {
            whereClause = {
                createdAt: { [Op.between]: [dateRange.start, dateRange.end] },
            };
        }

        return this.findAll({
            order: [['updatedAt', 'DESC']],
            where: whereClause,
            include: [{ model: OrderItem, as: 'items' }],
        });
    }

    static getOldestOrder() {
        return this.findOne({
            order: [['createdAt', 'ASC']],
        });
    }

    static storeOrder({ grantAmount, orderReason, postcode, items }) {
        const expiryDate = moment().subtract(5, 'months').toDate();
        return Promise.all([
            this.destroy({
                where: { createdAt: { [Op.lte]: expiryDate } },
            }),
            this.create(
                {
                    grantAmount: grantAmount,
                    orderReason: orderReason,
                    postcodeArea: toOutcode(postcode),
                    items: items,
                },
                { include: [{ model: OrderItem, as: 'items' }] }
            ),
        ]);
    }
}

module.exports = { Order, OrderItem };
