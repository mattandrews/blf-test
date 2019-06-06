'use strict';
const { Model, Op } = require('sequelize');

const bcrypt = require('bcryptjs');

class User extends Model {
    static init(sequelize, DataTypes) {
        const schema = {
            username: {
                type: DataTypes.STRING,
                allowNull: false
            },
            password: {
                type: DataTypes.STRING,
                allowNull: false
            },
            is_active: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            },
            is_password_reset: {
                type: DataTypes.BOOLEAN,
                allowNull: false,
                defaultValue: false
            }
        };

        return super.init(schema, {
            modelName: 'user',
            sequelize
        });
    }

    static encryptPassword(password) {
        const rounds = 12;
        return bcrypt.hash(password, rounds);
    }

    static hasValidPassword(storedHash, typedPass) {
        return bcrypt.compare(typedPass, storedHash);
    }

    static findByUsername(username) {
        return this.findOne({
            where: { username: { [Op.eq]: username } }
        });
    }

    static createUser({ username, password }) {
        return this.encryptPassword(password).then(encryptedPassword => {
            return this.create({
                username: username,
                password: encryptedPassword
            });
        });
    }

    static updateNewPassword({ id, newPassword }) {
        return this.encryptPassword(newPassword).then(newEncryptedPassword => {
            return this.update(
                {
                    password: newEncryptedPassword,
                    is_password_reset: false
                },
                { where: { id: { [Op.eq]: id } } }
            );
        });
    }

    static updateNewEmail({ id, newEmail }) {
        return this.update(
            { username: newEmail, is_active: false },
            { where: { id: { [Op.eq]: id } } }
        );
    }
}

module.exports = User;
